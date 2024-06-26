require("dotenv").config();
const { DogSitters } = require("../../db");
const cloudinary = require("../../../cloudinary");
const nodemailer = require("nodemailer");

const updateSitter = async ({
  id,
  name,
  surName,
  phone,
  description,
  dateOfBirth,
  email,
  password,
  address,
  neighborhood,
  city,
  rates,
  photos,
  photoProfile,
}) => {
  console.log("Datos recibidos en updateSitter:", {
    id,
    name,
    surName,
    phone,
    description,
    dateOfBirth,
    email,
    password,
    address,
    neighborhood,
    city,
    rates,
  });

  // verificamos que llega un valor id.
  if (!id) {
    throw new Error("Por favor, proporciona un ID válido.");
  }
  // verificamos que exista un usuario que corresponda a esa id
  const findSitter = await DogSitters.findOne({ where: { id } });
  console.log("Sitter encontrado en la base de datos:", findSitter); // Agregar este log
  if (!findSitter) {
    throw new Error("No coincide el id con un sitter");
  }
  // verificamos que llega por lo menos un valor que se actualize.
  if (
    !(
      name ||
      surName ||
      phone ||
      description ||
      dateOfBirth ||
      email ||
      password ||
      address ||
      neighborhood ||
      city ||
      photos ||
      photoProfile ||
      rates
    )
  ) {
    throw new Error(
      "Por favor, especifica la información que deseas actualizar."
    );
  }

  const updatedFields = {
    name: name || findSitter.name,
    surName: surName || findSitter.surName,
    phone: phone || findSitter.phone,
    description: description || findSitter.description,
    dateOfBirth: dateOfBirth || findSitter.dateOfBirth,
    email: email || findSitter.email,
    password: password || findSitter.password,
    address: address || findSitter.address,
    neighborhood: neighborhood || findSitter.neighborhood,
    city: city || findSitter.city,
    rates: rates || findSitter.rates,
    photoProfile: findSitter.photoProfile,
    photos: findSitter.photos,
  };

  // Si existe photoProfile:
  if (photoProfile) {
    const uploadedProfileImg = await cloudinary.uploader.upload(photoProfile, {
      upload_preset: "PawBnB_Profile",
      public_id: `${id}_${findSitter.name}_imgProfile`,
      allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
    });
    updatedFields.photoProfile = uploadedProfileImg.secure_url;
  }
console.log(findSitter.name)
  // Si existe photos
  if (photos) {
    const uploadedGallery = await cloudinary.uploader.upload(photos, {
      upload_preset: "PawBnB_Gallery",
      public_id: `${id}_${findSitter.name}_galleryimg_${findSitter.photos.length+1}`,
      allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
    });

    const galleryURL = uploadedGallery.secure_url;
    console.log(galleryURL);

    const imgsArray = findSitter.photos;
    const addIndex = imgsArray.length;

    const updatePhotosIndex = [
      ...imgsArray,
      { index: addIndex, url: galleryURL },
    ];

    updatedFields.photos = updatePhotosIndex;
  }

  // Actualizar el cuidador en la bdd
  const updatedSitter = await DogSitters.update(updatedFields, {
    where: { id },
  });
  console.log("Cuidador actualizado:", updatedSitter);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "pawbnb45@gmail.com",
      pass: "vvxf xvmb qebz qglj",
    },
  });

  let mailOptions = {
    from: "pawbnb45@gmail.com",
    to: updatedFields.email,
    subject: "Actualización de datos",
    html: `
      <h1>¡Hola ${name}!</h1>
      <p>Te informamos que tus datos en PawBnB han sido actualizados correctamente. Si no has realizado estos cambios o necesitas más información, por favor, no dudes en contactarnos.</p>
      <p>Gracias,</p>
      <p>El equipo de PawBnB</p>
      <img src="https://res.cloudinary.com/dlazmxpqm/image/upload/v1707404152/imagesPawBnB/d4urgnpnsgoyxv11rs0b.jpg" alt="Logo de Pawbnb" style="width: 200px;">
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email enviado: " + info.response);
    }
  });

  return updatedSitter;
};

module.exports = { updateSitter };
